import api from './axiosConfig'

export interface AuthLoginRequest {
  username: string
  password: string
}

export interface AuthUser {
  id: number
  username: string
  role: 'ADMIN' | 'BODEGUERO'
}

export interface AuthLoginResponse {
  accessToken: string
  tokenType: string
  user: AuthUser
}

export const authService = {
  login: (payload: AuthLoginRequest) => api.post<AuthLoginResponse>('/auth/login', payload),
}
