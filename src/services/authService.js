export const authService = {
  async login(loginName, password) {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginName, password }),
      });

      const data = await response.json();
      if (data.success && data.employee) {
        // Ensure all properties including empID are stored
        const employeeData = {
          id: data.employee.empID,
          name: data.employee.name,
          address: data.employee.address,
          mobile: data.employee.mobile,
          email: data.employee.email,
          designation: data.employee.designation,
          imageUrl: data.employee.imageUrl,
          loginName: data.employee.loginName,
          loginPassword: data.employee.loginPassword
        };
        localStorage.setItem('employee', JSON.stringify(employeeData));
        return data;
      } else {
        throw new Error(data.error || 'Login failed');
      }
  },

  async logout() {
    localStorage.removeItem('employee');
  },

  getCurrentEmployee() {
    try {
      const employee = localStorage.getItem('employee');
      if (!employee) return null;
      
      // Return the parsed employee data directly
      return JSON.parse(employee);
    } catch (error) {
      console.error('Error parsing employee data:', error);
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('employee');
  }
};
