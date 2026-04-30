import { query } from "../config/db.js";
import { Profile } from "../models/profile.model.js";

export class ProfileRepository {
  async createProfile({
    userId,
    fullName,
    bio,
    college,
    major,
    graduationYear,
    interests,
    availability,
    lookingFor,
    profileImageUrl
  }, executor = { query }) {
    const result = await executor.query(
      `
        INSERT INTO profiles (
          user_id,
          full_name,
          bio,
          college,
          major,
          graduation_year,
          interests,
          availability,
          looking_for,
          profile_image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          profile_id,
          user_id,
          full_name,
          bio,
          college,
          major,
          graduation_year,
          interests,
          availability,
          looking_for,
          profile_image_url
      `,
      [
        userId,
        fullName,
        bio,
        college,
        major,
        graduationYear,
        interests,
        availability,
        lookingFor,
        profileImageUrl
      ]
    );

    return new Profile(result.rows[0]);
  }

  async findByUserId(userId, executor = { query }) {
    const result = await executor.query(
      `
        SELECT
          profile_id,
          user_id,
          full_name,
          bio,
          college,
          major,
          graduation_year,
          interests,
          availability,
          looking_for,
          profile_image_url
        FROM profiles
        WHERE user_id = $1
      `,
      [userId]
    );

    return result.rows[0] ? new Profile(result.rows[0]) : null;
  }

  async findByUserIds(userIds, executor = { query }) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Map();
    }

    const result = await executor.query(
      `
        SELECT
          profile_id,
          user_id,
          full_name,
          bio,
          college,
          major,
          graduation_year,
          interests,
          availability,
          looking_for,
          profile_image_url
        FROM profiles
        WHERE user_id = ANY($1::uuid[])
      `,
      [userIds]
    );

    return new Map(
      result.rows.map((row) => [row.user_id, new Profile(row)])
    );
  }

  async updateByUserId(
    userId,
    {
      fullName,
      bio,
      college,
      major,
      graduationYear,
      interests,
      availability,
      lookingFor,
      profileImageUrl
    },
    executor = { query }
  ) {
    const result = await executor.query(
      `
        UPDATE profiles
        SET full_name = $2,
            bio = $3,
            college = $4,
            major = $5,
            graduation_year = $6,
            interests = $7,
            availability = $8,
            looking_for = $9,
            profile_image_url = $10
        WHERE user_id = $1
        RETURNING
          profile_id,
          user_id,
          full_name,
          bio,
          college,
          major,
          graduation_year,
          interests,
          availability,
          looking_for,
          profile_image_url
      `,
      [
        userId,
        fullName,
        bio,
        college,
        major,
        graduationYear,
        interests,
        availability,
        lookingFor,
        profileImageUrl
      ]
    );

    return result.rows[0] ? new Profile(result.rows[0]) : null;
  }
}
