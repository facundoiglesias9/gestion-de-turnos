-- Add paid column to turns table
ALTER TABLE turns ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own expenses
CREATE POLICY "Users can view their own expenses"
    ON expenses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own expenses
CREATE POLICY "Users can insert their own expenses"
    ON expenses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own expenses
CREATE POLICY "Users can delete their own expenses"
    ON expenses
    FOR DELETE
    USING (auth.uid() = user_id);
