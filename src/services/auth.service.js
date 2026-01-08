import User from "../models/User.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.utils.js";
import { logger } from "../utils/logger.js";
import bcrypt from "bcryptjs";

export class AuthService {
  static async register(userData) {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error("Email already registered");
      }

      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: await bcrypt.hash(userData.password, 12),
      });

      logger.info("User registered successfully", {
        userId: user._id,
        email: user.email,
      });

      return user;
    } catch (error) {
      logger.error("Registration failed", { error: error.message });
      throw error;
    }
  }

  static async login(email, password) {
    try {
      const user = await User.findOne({ email }).select("+password");

      if (!user || !user.isActive) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      user.lastLogin = Date.now();
      await user.save();

      logger.info("User logged in successfully", {
        userId: user._id,
        email: user.email,
      });

      return { user, accessToken, refreshToken };
    } catch (error) {
      logger.error("Login failed", { error: error.message });
      throw error;
    }
  }

  static async refreshToken(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const user = await User.findById(decoded.id).select("+refreshToken");
      if (!user || user.refreshToken !== refreshToken) {
        throw new Error("Invalid refresh token");
      }

      const newAccessToken = generateAccessToken(user._id);

      return newAccessToken;
    } catch (error) {
      logger.error("Token refresh failed", { error: error.message });
      throw error;
    }
  }

  static async logout(userId) {
    try {
      await User.findByIdAndUpdate(userId, { refreshToken: null });
      logger.info("User logged out", { userId });
    } catch (error) {
      logger.error("Logout failed", { error: error.message });
      throw error;
    }
  }

  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select("+password");

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      user.password = await bcrypt.hash(newPassword, 12);
      await user.save();

      logger.info("Password changed successfully", { userId });
    } catch (error) {
      logger.error("Password change failed", { error: error.message });
      throw error;
    }
  }
}
