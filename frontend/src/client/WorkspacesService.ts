import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type {
    WorkspacesCreateWorkspaceData,
    WorkspacesCreateWorkspaceResponse,
    WorkspacesDeleteWorkspaceData,
    WorkspacesDeleteWorkspaceResponse,
    WorkspacesReadWorkspaceData,
    WorkspacesReadWorkspaceResponse,
    WorkspacesReadWorkspacesData,
    WorkspacesReadWorkspacesResponse,
    WorkspacesUpdateWorkspaceData,
    WorkspacesUpdateWorkspaceResponse,
    WorkspaceMembersPublic
} from './types.gen';


export class WorkspacesService {

    public static readWorkspaces(data: WorkspacesReadWorkspacesData = {}): CancelablePromise<WorkspacesReadWorkspacesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/workspaces/',
            query: {
                skip: data.skip,
                limit: data.limit
            },
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static createWorkspace(data: WorkspacesCreateWorkspaceData): CancelablePromise<WorkspacesCreateWorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/workspaces/',
            body: data.requestBody,
            mediaType: 'application/json',
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static readWorkspace(data: WorkspacesReadWorkspaceData): CancelablePromise<WorkspacesReadWorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/workspaces/{id}',
            path: {
                id: data.id
            },
            errors: {
                422: 'Validation Error',
                404: 'Not Found'
            }
        });
    }

    public static updateWorkspace(data: WorkspacesUpdateWorkspaceData): CancelablePromise<WorkspacesUpdateWorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/workspaces/{id}',
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

    public static deleteWorkspace(data: WorkspacesDeleteWorkspaceData): CancelablePromise<WorkspacesDeleteWorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/workspaces/{id}',
            path: {
                id: data.id
            },
            errors: {
                422: 'Validation Error',
                404: 'Not Found'
            }
        });
    }


    public static readWorkspaceMembers(data: { id: string, skip?: number, limit?: number }): CancelablePromise<WorkspaceMembersPublic> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/workspaces/{id}/members',
            path: {
                id: data.id
            },
            query: {
                skip: data.skip,
                limit: data.limit
            },
            errors: {
                422: 'Validation Error',
                404: 'Not Found'
            }
        });
    }

}
