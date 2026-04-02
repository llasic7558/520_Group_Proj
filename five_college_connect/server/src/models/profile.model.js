export class Profile {
  constructor({
    profile_id = null,
    user_id,
    full_name = "",
    bio = "",
    college = null,
    major = null,
    graduation_year = null,
    skills = [],
    courses = [],
    interests = "",
    availability = "",
    looking_for = "",
    profile_image_url = ""
  }) {
    this.profileId = profile_id;
    this.userId = user_id;
    this.fullName = full_name;
    this.bio = bio;
    this.college = college;
    this.major = major;
    this.graduationYear = graduation_year;
    this.skills = skills;
    this.courses = courses;
    this.coursesTaken = courses;
    this.interests = interests;
    this.availability = availability;
    this.lookingFor = looking_for;
    this.profileImageUrl = profile_image_url;
  }
}
