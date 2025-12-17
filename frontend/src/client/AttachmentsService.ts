import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type {
    AttachmentsCreateAttachmentData,
    AttachmentsCreateAttachmentResponse,
    AttachmentsDeleteAttachmentData,
    AttachmentsDeleteAttachmentResponse,
    AttachmentsReadAttachmentsData,
    AttachmentsReadAttachmentsResponse
} from './types.gen';

export class AttachmentsService {

    public static readAttachments(data: AttachmentsReadAttachmentsData): CancelablePromise<AttachmentsReadAttachmentsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/attachments/',
            query: {
                skip: data.skip,
                limit: data.limit,
                task_id: data.taskId
            },
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static createAttachment(data: AttachmentsCreateAttachmentData): CancelablePromise<AttachmentsCreateAttachmentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/attachments/',
            query: {
                task_id: data.taskId
            },
            formData: data.formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static deleteAttachment(data: AttachmentsDeleteAttachmentData): CancelablePromise<AttachmentsDeleteAttachmentResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/attachments/{id}',
            path: {
                id: data.id
            },
            errors: {
                422: 'Validation Error',
                404: 'Not Found'
            }
        });
    }

    public static getAttachmentUrl(data: { id: string }): CancelablePromise<{ message: string }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/attachments/{id}/url',
            path: {
                id: data.id
            },
            errors: {
                404: 'Not Found'
            }
        });
    }

}
