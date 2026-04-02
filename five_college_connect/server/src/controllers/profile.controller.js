export async function createProfile(_req, res) {
  // profile data is created during sign-up so the frontend only needs
  // one request to create the account and initial profile information.
  res.status(405).json({
    message: "Use POST /api/auth/signup to create the user and initial profile together"
  });
}

export async function updateProfile(_req, res) {
  res.status(501).json({
    message: "Profile editing not implemented yet"
  });
}

export async function getProfile(_req, res) {
  res.status(501).json({
    message: "Profile retrieval endpoint not implemented yet"
  });
}
