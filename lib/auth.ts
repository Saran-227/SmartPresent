export interface User {
  id: string
  name: string
  email: string
  password: string
  collegeUID: string
  createdAt: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
}

export class AuthService {
  private static readonly USERS_KEY = "smartpresent_users"
  private static readonly AUTH_KEY = "smartpresent_auth"

  static getUsers(): User[] {
    if (typeof window === "undefined") return []
    const users = localStorage.getItem(this.USERS_KEY)
    return users ? JSON.parse(users) : []
  }

  static saveUsers(users: User[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
  }

  static getAuthState(): AuthState {
    if (typeof window === "undefined") return { isAuthenticated: false, user: null }
    const auth = localStorage.getItem(this.AUTH_KEY)
    return auth ? JSON.parse(auth) : { isAuthenticated: false, user: null }
  }

  static setAuthState(state: AuthState): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(state))
  }

  static signup(userData: Omit<User, "id" | "createdAt">): { success: boolean; message: string; user?: User } {
    const users = this.getUsers()

    // Check if user already exists
    const existingUser = users.find((u) => u.email === userData.email || u.collegeUID === userData.collegeUID)
    if (existingUser) {
      return { success: false, message: "User with this email or College UID already exists" }
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}`,
      ...userData,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    this.saveUsers(users)

    return { success: true, message: "Account created successfully", user: newUser }
  }

  static login(collegeUID: string, password: string): { success: boolean; message: string; user?: User } {
    const users = this.getUsers()
    const user = users.find((u) => u.collegeUID === collegeUID && u.password === password)

    if (!user) {
      return { success: false, message: "Invalid College UID or password" }
    }

    const authState: AuthState = { isAuthenticated: true, user }
    this.setAuthState(authState)

    return { success: true, message: "Login successful", user }
  }

  static logout(): void {
    this.setAuthState({ isAuthenticated: false, user: null })
  }

  static isAuthenticated(): boolean {
    return this.getAuthState().isAuthenticated
  }

  static getCurrentUser(): User | null {
    return this.getAuthState().user
  }
}
