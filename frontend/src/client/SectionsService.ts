import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type {
    SectionsCreateSectionData,
    SectionsCreateSectionResponse,
    SectionsDeleteSectionData,
    SectionsDeleteSectionResponse,
    SectionsReadSectionsData,
    SectionsReadSectionsResponse,
    SectionsUpdateSectionData,
    SectionsUpdateSectionResponse
} from './types.gen';

export class SectionsService {

    public static readSections(data: SectionsReadSectionsData): CancelablePromise<SectionsReadSectionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/sections/',
            query: {
                skip: data.skip,
                limit: data.limit,
                project_id: data.projectId
            },
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static createSection(data: SectionsCreateSectionData): CancelablePromise<SectionsCreateSectionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/sections/',
            body: data.requestBody,
            mediaType: 'application/json',
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static updateSection(data: SectionsUpdateSectionData): CancelablePromise<SectionsUpdateSectionResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/sections/{id}',
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

    public static deleteSection(data: SectionsDeleteSectionData): CancelablePromise<SectionsDeleteSectionResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/sections/{id}',
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
