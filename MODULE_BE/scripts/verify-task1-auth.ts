import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersService } from '../src/modules/users/users.service';
import { UnauthorizedException } from '@nestjs/common';

async function runAuthVerification() {
  console.log('🚀 Starting Verification: Task 1 (Auth, Login & Session Flow)...');
  
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const authService = app.get(AuthService);
  const usersService = app.get(UsersService);

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Subtask 1.1: Invalid login credentials
    console.log('\n--- 1. Testing Invalid Credentials (PB-02 / Subtask 1.1) ---');
    let rejected = false;
    try {
      await authService.login({
        phoneOrEmail: '0889266484',
        password: 'IncorrectPassword!',
      });
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        rejected = true;
      }
    }
    assert(rejected, 'Login with incorrect password correctly throws UnauthorizedException (401)');

    // 2. Subtask 1.1 & 1.2: Valid Admin Login
    console.log('\n--- 2. Testing Valid Admin Login (PB-02 / Subtask 1.1, 1.2) ---');
    const adminLogin = await authService.login({
      phoneOrEmail: '0889266484',
      password: 'Password123!',
    });
    assert(Boolean(adminLogin.accessToken), 'Returns valid accessToken string');
    assert(Boolean(adminLogin.refreshToken), 'Returns valid refreshToken string');
    assert(adminLogin.user.role === 'admin', `User role is correctly identified as admin (got: ${adminLogin.user.role})`);

    // 3. Subtask 1.1 & 1.2: Valid Contributor Login
    console.log('\n--- 3. Testing Valid Contributor Login (PB-02 / Subtask 1.1, 1.2) ---');
    const contribLogin = await authService.login({
      phoneOrEmail: '0911309340',
      password: 'Password123!',
    });
    assert(contribLogin.user.role === 'contributor', `User role is correctly identified as contributor (got: ${contribLogin.user.role})`);

    // 4. Subtask 1.3: Silent Refresh Token Flow
    console.log('\n--- 4. Testing Silent Refresh Token (PB-03 / Subtask 1.3) ---');
    const refreshed = await authService.refreshToken(adminLogin.refreshToken);
    assert(Boolean(refreshed.accessToken), 'Successfully re-issues new accessToken upon refresh');
    assert(Boolean(refreshed.refreshToken), 'Rotates/maintains refreshToken for seamless session');

    // 5. Subtask 1.3: Invalid Refresh Token
    console.log('\n--- 5. Testing Invalid Refresh Token (PB-03 / Subtask 1.3) ---');
    let refreshRejected = false;
    try {
      await authService.refreshToken('invalid.jwt.token.here');
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        refreshRejected = true;
      }
    }
    assert(refreshRejected, 'Malformed or invalid refresh token is rejected with 401 Unauthorized');

    // 6. Subtask 1.4: Logout & Token Revocation
    console.log('\n--- 6. Testing Logout & Token Revocation (PB-02 / Subtask 1.4) ---');
    const logoutRes = await authService.logout(refreshed.refreshToken);
    assert(logoutRes.message === 'Logged out successfully', 'Logout returns success message');

    const userAfterLogout = await usersService.findById(adminLogin.user.id);
    assert(userAfterLogout?.refreshToken === null || userAfterLogout?.refreshToken === undefined, 'RefreshToken cleared in database upon logout');

    console.log(`\n🎉 Verification Summary: ${passed}/${total} checks passed!`);
  } catch (error) {
    console.error('Fatal error during auth verification:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

runAuthVerification();
