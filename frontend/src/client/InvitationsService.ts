import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"
import type { InvitationCreate, InvitationPublic, Message } from "./types.gen"

export class InvitationsService {
  /**
   * Create Invitation
   * Create an invitation for a user to join a workspace.
   * @returns InvitationPublic Successful Response
   * @throws ApiError
   */
  public static createInvitation({
    requestBody,
  }: {
    requestBody: InvitationCreate
  }): CancelablePromise<InvitationPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/invitations/",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    })
  }

  /**
   * Get Invitation
   * Get invitation details by token.
   * @returns InvitationPublic Successful Response
   * @throws ApiError
   */
  public static getInvitation({
    token,
  }: {
    token: string
  }): CancelablePromise<InvitationPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/invitations/{token}",
      path: {
        token: token,
      },
      errors: {
        422: `Validation Error`,
      },
    })
  }

  /**
   * Accept Invitation
   * Accept an invitation.
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static acceptInvitation({
    token,
  }: {
    token: string
  }): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/invitations/accept",
      query: {
        token: token,
      },
      errors: {
        422: `Validation Error`,
      },
    })
  }
}
