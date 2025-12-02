-- Create prices table
CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS prices_user_id_idx ON prices(user_id);

-- Enable Row Level Security
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own prices
CREATE POLICY "Users can view their own prices"
    ON prices
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own prices
CREATE POLICY "Users can insert their own prices"
    ON prices
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own prices
CREATE POLICY "Users can update their own prices"
    ON prices
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy: Users can delete their own prices
CREATE POLICY "Users can delete their own prices"
    ON prices
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_prices_updated_at
    BEFORE UPDATE ON prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
