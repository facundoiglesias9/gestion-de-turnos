-- Create turns table
CREATE TABLE IF NOT EXISTS turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS turns_user_id_idx ON turns(user_id);

-- Create index on date_time for sorting
CREATE INDEX IF NOT EXISTS turns_date_time_idx ON turns(date_time);

-- Enable Row Level Security
ALTER TABLE turns ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own turns
CREATE POLICY "Users can view their own turns"
    ON turns
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own turns
CREATE POLICY "Users can insert their own turns"
    ON turns
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own turns
CREATE POLICY "Users can update their own turns"
    ON turns
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy: Users can delete their own turns
CREATE POLICY "Users can delete their own turns"
    ON turns
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_turns_updated_at
    BEFORE UPDATE ON turns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
