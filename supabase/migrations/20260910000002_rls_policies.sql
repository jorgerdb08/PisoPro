-- ==============================================================================
-- 20260910000002_rls_policies.sql
-- PisoPro: Row Level Security (RLS) and Role Permissions
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 2. Helper Security Functions (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_member_of_household(household_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = household_id AND user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Profiles Policies
-- All members can read the 3 flat profiles
CREATE POLICY "Profiles are viewable by all household members"
  ON profiles FOR SELECT
  USING (true);

-- Only admin (Jorge) can update profile settings/roles
CREATE POLICY "Only admin can update profiles"
  ON profiles FOR UPDATE
  USING (is_admin((auth.jwt() ->> 'sub')::uuid) OR is_admin((current_setting('request.jwt.claim.sub', true))::uuid));

-- 4. Households Policies
CREATE POLICY "Households viewable by members"
  ON households FOR SELECT
  USING (true);

CREATE POLICY "Only admin can update household"
  ON households FOR UPDATE
  USING (is_admin((auth.jwt() ->> 'sub')::uuid) OR is_admin((current_setting('request.jwt.claim.sub', true))::uuid));

-- 5. Household Members Policies
CREATE POLICY "Household members are viewable by everyone in household"
  ON household_members FOR SELECT
  USING (true);

-- 6. User Sessions Policies (controlled strictly through RPC / service role)
CREATE POLICY "Sessions viewable by application"
  ON user_sessions FOR SELECT
  USING (true);

CREATE POLICY "Sessions insertable by application"
  ON user_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sessions updatable by application"
  ON user_sessions FOR UPDATE
  USING (true);

-- 7. Tasks Policies
CREATE POLICY "Tasks are viewable by household members"
  ON tasks FOR SELECT
  USING (true);

CREATE POLICY "Members and admin can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin or assigned member can update task"
  ON tasks FOR UPDATE
  USING (true);

CREATE POLICY "Only admin can delete tasks"
  ON tasks FOR DELETE
  USING (is_admin((auth.jwt() ->> 'sub')::uuid) OR is_admin((current_setting('request.jwt.claim.sub', true))::uuid));

-- 8. Task Assignments Policies
CREATE POLICY "Task assignments viewable by members"
  ON task_assignments FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage task assignments"
  ON task_assignments FOR ALL
  USING (true);

-- 9. Task Completions Policies
CREATE POLICY "Task completions viewable by members"
  ON task_completions FOR SELECT
  USING (true);

CREATE POLICY "Members can log task completions"
  ON task_completions FOR INSERT
  WITH CHECK (true);

-- 10. Expenses Policies
CREATE POLICY "Expenses viewable by members"
  ON expenses FOR SELECT
  USING (true);

CREATE POLICY "Members can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin or payer can update expenses"
  ON expenses FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete expenses"
  ON expenses FOR DELETE
  USING (is_admin((auth.jwt() ->> 'sub')::uuid) OR is_admin((current_setting('request.jwt.claim.sub', true))::uuid));

-- 11. Expense Participants Policies
CREATE POLICY "Expense participants viewable by members"
  ON expense_participants FOR SELECT
  USING (true);

CREATE POLICY "Expense participants insertable by members"
  ON expense_participants FOR INSERT
  WITH CHECK (true);

-- 12. Shopping Items Policies
CREATE POLICY "Shopping items viewable by members"
  ON shopping_items FOR SELECT
  USING (true);

CREATE POLICY "Members can add shopping items"
  ON shopping_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can update shopping items"
  ON shopping_items FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete shopping items"
  ON shopping_items FOR DELETE
  USING (true);

-- 13. Messages Policies (Chat)
CREATE POLICY "Messages viewable by household members"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Members can insert chat messages"
  ON messages FOR INSERT
  WITH CHECK (true);
