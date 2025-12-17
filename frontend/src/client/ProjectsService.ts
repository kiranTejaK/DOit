import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type {
    ProjectsCreateProjectData,
    ProjectsCreateProjectResponse,
    ProjectsDeleteProjectData,
    ProjectsDeleteProjectResponse,
    ProjectsReadProjectData,
    ProjectsReadProjectResponse,
    ProjectsReadProjectsData,
    ProjectsReadProjectsResponse,
    ProjectsUpdateProjectData,
    ProjectsUpdateProjectResponse
} from './types.gen';

export class ProjectsService {

    public static readProjects(data: ProjectsReadProjectsData = {}): CancelablePromise<ProjectsReadProjectsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/projects/',
            query: {
                skip: data.skip,
                limit: data.limit,
                workspace_id: data.workspaceId
            },
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static createProject(data: ProjectsCreateProjectData): CancelablePromise<ProjectsCreateProjectResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/projects/',
            body: data.requestBody,
            mediaType: 'application/json',
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static readProject(data: ProjectsReadProjectData): CancelablePromise<ProjectsReadProjectResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/projects/{id}',
            path: {
                id: data.id
            },
            errors: {
                422: 'Validation Error',
                404: 'Not Found'
            }
        });
    }

    public static updateProject(data: ProjectsUpdateProjectData): CancelablePromise<ProjectsUpdateProjectResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/projects/{id}',
            path: {
                id: data.id
            },
            body: data.requestBody,
            mediaType: 'application/json',
            errors: {
                422: 'Validation Error',
                404: 'Not Found'
            }
        });
    }

    public static deleteProject(data: ProjectsDeleteProjectData): CancelablePromise<ProjectsDeleteProjectResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/projects/{id}',
            path: {
                id: data.id
            },
            errors: {
                422: 'Validation Error',
                404: 'Not Found'
            }
        });
    }

}
