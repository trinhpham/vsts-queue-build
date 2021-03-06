import path = require('path');
import fs = require('fs');

import { BuildWorker } from '../queue-build.worker';
import { IEnvironmentConfiguration } from '../configuration';
import { TeamProjectType } from '../enum/team-project-type.enum';

export abstract class TaskSummary {
    public static attach(
        builds: Array<BuildWorker>,
        environmentConfiguration: IEnvironmentConfiguration
    ) {
        if (environmentConfiguration == null || environmentConfiguration.workDirectory == null) {
            return;
        }
        var filepath = path.join(environmentConfiguration.workDirectory, `QueueBuild-BuildResult.html`);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        fs.writeFileSync(filepath, TaskSummary.getSummary(builds, environmentConfiguration));

        console.log("##vso[task.addattachment type=Distributedtask.Core.Summary;name=Queued Builds;]" + filepath);
        console.log('Queued builds linked to build result');
    }

    private static getSummary(
        builds: Array<BuildWorker>,
        environmentConfiguration: IEnvironmentConfiguration
    ): string {
        let summary = '';
        let baseIconDefinition = `style="vertical-align:top" class="icon`;

        for (let i = 0; i < builds.length; i++) {
            summary += `<div style="padding: 3px 0">\n`;

            let buildResult = builds[i].getBuildResult();

            // Invalid build
            if (buildResult == null) {
                summary += `<span ${baseIconDefinition} build-failure-icon-color bowtie-edit-delete" aria-label="failed" title="Invalid"></span><span>${builds[i].getBuildName()}</span>\n`;
            }

            // Valid build
            else {
                if (environmentConfiguration != null && environmentConfiguration.async === true) {
                    summary += `<span ${baseIconDefinition} icon-tfs-build-status-inprogress" aria-label="started" title="Started"></span>\n`;
                }
                else {
                    if (builds[i].isPartiallySucceeded() === true) {
                        summary += `<span ${baseIconDefinition} icon-tfs-build-status-partiallysucceeded" aria-label="succeeded" title="Partially succeeded"></span>\n`;
                    }
                    else if (builds[i].isSucceeded() === true) {
                        summary += `<span ${baseIconDefinition} icon-tfs-build-status-succeeded" aria-label="succeeded" title="Succeeded"></span>\n`;
                    }
                    else {
                        summary += `<span ${baseIconDefinition} icon-tfs-build-status-failed" aria-label="failed" title="Failed"></span>\n`;
                    }
                }

                let buildNameOutput = buildResult.definition.name;
                if (environmentConfiguration.teamProjectType === TeamProjectType.JsonConfiguration) {
                    buildNameOutput += `  (Team project: ${buildResult.project.name})`;
                }

                summary += `<a href="${buildResult._links.web.href}">${buildNameOutput}</a>\n`;
            }

            summary += `</div>\n`;
        }

        return summary;
    }
}