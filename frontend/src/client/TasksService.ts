import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type {
    TasksCreateTaskData,
    TasksCreateTaskResponse,
    TasksDeleteTaskData,
    TasksDeleteTaskResponse,
    TasksReadTaskData,
    TasksReadTaskResponse,
    TasksReadTasksData,
    TasksReadTasksResponse,
    TasksUpdateTaskData,
    TasksUpdateTaskResponse
} from './types.gen';

export class TasksService {

    public static readTasks(data: TasksReadTasksData = {}): CancelablePromise<TasksReadTasksResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tasks/',
            query: {
                skip: data.skip,
                limit: data.limit,
                project_id: data.projectId,
                assignee_id: data.assigneeId
            },
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static createTask(data: TasksCreateTaskData): CancelablePromise<TasksCreateTaskResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tasks/',
            body: data.requestBody,
            mediaType: 'application/json',
            errors: {
                422: 'Validation Error'
            }
        });
    }

    public static readTask(data: TasksReadTaskData): CancelablePromise<TasksReadTaskResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tasks/{id}',
            path: {
                id: data.id
            },
            errors: {
                422: 'Validation Error',
                404: 'Not Found'
            }
        });
    }

    public static updateTask(data: TasksUpdateTaskData): CancelablePromise<TasksUpdateTaskResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/tasks/{id}',
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

    public static deleteTask(data: TasksDeleteTaskData): CancelablePromise<TasksDeleteTaskResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/tasks/{id}',
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
