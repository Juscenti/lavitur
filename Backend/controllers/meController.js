// Backend/controllers/meController.js — current user profile (authenticated)
import { supabaseAdmin } from '../config/supabase.js';

export async function getMe(req, res) {
  try {
    const profile = req.profile;
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({
      id: profile.id,
      email: profile.email,
      username: profile.username,
      full_name: profile.full_name,
      role: profile.role,
      status: profile.status,
      created_at: profile.created_at,
    });
  } catch (err) {
    console.error('getMe:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch profile' });
  }
}

export async function updateMe(req, res) {
  try {
    const userId = req.userId;
    const { username, full_name } = req.body;

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (full_name !== undefined) updates.full_name = full_name;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('updateMe:', err);
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
}
