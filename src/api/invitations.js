import apiClient from './client.js';

export function listMyInvitations() {
  return apiClient.get('/projects/invitations/mine/');
}

export function acceptInvitation(invitationId) {
  return apiClient.post(`/projects/invitations/${invitationId}/accept/`);
}

export function declineInvitation(invitationId) {
  return apiClient.post(`/projects/invitations/${invitationId}/decline/`);
}
