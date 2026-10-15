export interface LoginCredentials {
  phoneOrEmail: string;
  password?: string;
  otp?: string;
}

export interface RegisterCredentials {
  name: string;
  phone: string;
  email?: string;
  password?: string;
}
