import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type {
    CommentsCreateCommentData,
    CommentsCreateCommentResponse,
    CommentsDeleteCommentData,
    CommentsDeleteCommentResponse,
    CommentsReadCommentsData,
    CommentsReadCommentsResponse
} from './types.gen';

export class CommentsService {

    public static readComments(data: CommentsReadCommentsData): CancelablePromise<CommentsReadCommentsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/comments/',
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

    public static createComment(data: CommentsCreateCommentData): CancelablePromise<CommentsCreateCommentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/comments/',
            body: data.requestBody,
            mediaType: 'application/json',
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static deleteComment(data: CommentsDeleteCommentData): CancelablePromise<CommentsDeleteCommentResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/comments/{id}',
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
