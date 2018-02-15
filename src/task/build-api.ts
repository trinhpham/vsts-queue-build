import { Build } from "vso-node-api/interfaces/BuildInterfaces";
import { IBuildApi } from "vso-node-api/BuildApi";

export class BuildApi {
    constructor(private buildApi: IBuildApi) { }

    public queueBuild(build: Build, project: string, ignoreWarnings: boolean) {
        return this.buildApi.queueBuild(build, project, ignoreWarnings);
    }

    public getDefinitions(project: string) {
        return this.buildApi.getDefinitions(project);
    }

    public getBuild(buildId: number) {
        return this.buildApi.getBuild(buildId);
    }
}