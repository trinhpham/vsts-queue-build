import { IBuildApi } from 'vso-node-api/BuildApi';
import { Build, BuildStatus } from 'vso-node-api/interfaces/BuildInterfaces';

const outputTimeInterval: number = 150000; // 2.5 Minutes

export class Worker {

    protected buildQueueResult: Build;
    protected cachedStatus: boolean;
    protected lastOutputTime: number;

    constructor(
        protected buildName: string,
        protected teamProject: string,
        protected buildApi: IBuildApi,
        protected debug: boolean
    ) {
    }

    public async queueBuild(): Promise<void> {

        // Get build definitions
        let buildDefinitions = await this.buildApi.getDefinitions(this.teamProject);
        if (this.debug) {
            console.log(`Builds: ${JSON.stringify(buildDefinitions)}`);
        }

        // Process build path
        let pathIndex = this.buildName.lastIndexOf('\\');
        let path =  '\\'; // default value;
        if (pathIndex >= 0) {
            path = this.buildName.substring(0, pathIndex);
            if (path.length == 0) { // Special case for leading \ without subfolder
                path = '\\';
            }
            else if (path[0] !== '\\') { // Make leading \ optional
                path = '\\' + path;
            }

            this.buildName = this.buildName.substring(pathIndex + 1, this.buildName.length); // Remove path from build name
        }

        if (this.debug) {
            console.log(`Path: ${path}, Build name: ${this.buildName}`);
        }

        // Find build definition
        let buildDefinition = buildDefinitions.find(b => b.name === this.buildName && b.path == path);
        if (buildDefinition == null) {
            throw `Build definition not found`;
        }
        if (this.debug) {
            console.log(`Build definition id: ${buildDefinition.id}`);
        }

        // Queue build 
        let build: Build = <Build>{ definition: { id: 0 } };
        build.definition.id = buildDefinition.id;

        this.buildQueueResult = await this.buildApi.queueBuild(build, this.teamProject, true);
        console.log(`Build "${this.buildName}" started - ${this.buildQueueResult.buildNumber}`);

        this.lastOutputTime = new Date().getTime();
    }

    public async getCompletedStatus(): Promise<boolean> {
        // Avoid status check for already completed tasks
        if (this.cachedStatus === true) {
            return this.cachedStatus;
        }

        // Check build status
        if ((await this.buildApi.getBuild(this.buildQueueResult.id)).status === BuildStatus.Completed) {
            console.log(`Build "${this.buildName}" completed - ${this.buildQueueResult.buildNumber}`);

            this.cachedStatus = true;
            return true;
        }

        // Ensure output during running builds
        let currentTime = new Date().getTime();
        if (currentTime - outputTimeInterval > this.lastOutputTime) {
            console.log(`Build "${this.buildName}" is running - ${this.buildQueueResult.buildNumber}`);
            this.lastOutputTime = currentTime;
        }

        return false;
    }
}