import axios from '../lib/axios';
import type { 
  AdminUsersResponse, 
  AdminUserResponse, 
  UpdateUserRoleRequest, 
  UpdateUserRequest,
  UpdateUserResponse,
  CreateUserRequest,
  CreateUserResponse
} from '../types/admin.types';

class AdminService {
  /**
   * Fetch all users for admin management
   */
  async getUsers(): Promise<AdminUsersResponse> {
    const response = await axios.get('/admin/users');
    return response.data;
  }

  /**
   * Fetch a specific user by ID
   */
  async getUserById(userId: string): Promise<AdminUserResponse> {
    const response = await axios.get(`/admin/users/${userId}`);
    return response.data;
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, data: UpdateUserRoleRequest): Promise<UpdateUserResponse> {
    const response = await axios.put(`/admin/users/${userId}/role`, data);
    return response.data;
  }

  /**
   * Update user information (all fields including features)
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<UpdateUserResponse> {
    const response = await axios.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await axios.post('/admin/users', data);
    return response.data;
  }

  /**
   * Create a new site for a user
   */
  async createSite(data: {
    userId: string;
    name: string;
    url: string;
    checkInterval?: number;
    monthlyReport?: boolean;
    monthlyReportSendAt?: string;
  }): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    const response = await axios.post('/admin/sites', data);
    return response.data;
  }

  /**
   * Update an existing site
   */
  async updateSite(siteId: string, data: {
    name: string;
    url: string;
    checkInterval?: number;
    monthlyReport?: boolean;
    monthlyReportSendAt?: string;
  }): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    const response = await axios.put(`/admin/sites/${siteId}`, data);
    return response.data;
  }

  /**
   * Delete a site
   */
  async deleteSite(siteId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await axios.delete(`/admin/sites/${siteId}`);
    return response.data;
  }
}

export default new AdminService(); 