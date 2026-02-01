-- MatteiWeekly Manager - Row Level Security Policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Articles viewable based on role" ON articles;
DROP POLICY IF EXISTS "Users can insert own articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles;
DROP POLICY IF EXISTS "Comments viewable by article viewers" ON comments;
DROP POLICY IF EXISTS "Verificators and admins can insert comments" ON comments;
DROP POLICY IF EXISTS "Todos viewable by verificators and admins" ON todos;
DROP POLICY IF EXISTS "Verificators and admins can manage todos" ON todos;
DROP POLICY IF EXISTS "Chat messages viewable by authenticated users" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Articles policies
CREATE POLICY "Articles viewable based on role"
    ON articles FOR SELECT
    USING (
        autore_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND ruolo IN ('verificatore', 'amministratore')
        )
    );

CREATE POLICY "Users can insert own articles"
    ON articles FOR INSERT
    WITH CHECK (autore_id = auth.uid());

CREATE POLICY "Users can update own articles"
    ON articles FOR UPDATE
    USING (
        autore_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND ruolo IN ('verificatore', 'amministratore')
        )
    );

CREATE POLICY "Users can delete own articles"
    ON articles FOR DELETE
    USING (
        autore_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND ruolo = 'amministratore'
        )
    );

-- Comments policies
CREATE POLICY "Comments viewable by article viewers"
    ON comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM articles a
            WHERE a.id = articolo_id
            AND (
                a.autore_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND ruolo IN ('verificatore', 'amministratore')
                )
            )
        )
    );

CREATE POLICY "Verificators and admins can insert comments"
    ON comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND ruolo IN ('verificatore', 'amministratore')
        )
    );

-- Todos policies
CREATE POLICY "Todos viewable by verificators and admins"
    ON todos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND ruolo IN ('verificatore', 'amministratore')
        )
    );

CREATE POLICY "Verificators and admins can manage todos"
    ON todos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND ruolo IN ('verificatore', 'amministratore')
        )
    );

-- Chat messages policies
CREATE POLICY "Chat messages viewable by authenticated users"
    ON chat_messages FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert messages"
    ON chat_messages FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own messages"
    ON chat_messages FOR UPDATE
    USING (autore_id = auth.uid());

CREATE POLICY "Users can delete own messages"
    ON chat_messages FOR DELETE
    USING (autore_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (utente_id = auth.uid());

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (utente_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (utente_id = auth.uid());
