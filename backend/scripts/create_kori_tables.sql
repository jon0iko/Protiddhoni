-- 1. Wallets Table
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast user wallet lookup
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

-- 2. Kori Transactions Ledger (Double-Entry Bookkeeping)
CREATE TABLE public.kori_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL, -- Can be null for system minting/purchases
    to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,   -- Can be null for withdrawals/spending
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'tip', 'quiz_reward', 'withdrawal', 'system_mint', 'refund')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    reference_id VARCHAR(255) UNIQUE, -- Webhook Trx ID, Stripe session, etc.
    metadata JSONB, -- For extra metadata (e.g., tipped content ID, chapter ID)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for fast transaction lookups
CREATE INDEX idx_transactions_from_wallet ON public.kori_transactions(from_wallet_id);
CREATE INDEX idx_transactions_to_wallet ON public.kori_transactions(to_wallet_id);
CREATE INDEX idx_transactions_reference ON public.kori_transactions(reference_id);

-- 3. Webhooks Log for Idempotency
CREATE TABLE public.payment_webhooks_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL, -- e.g., 'bkash', 'sslcommerz'
    transaction_id VARCHAR(255) UNIQUE NOT NULL, -- The external reference ID from gateway
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'duplicate')),
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_transaction_id ON public.payment_webhooks_log(transaction_id);

-- 4. RPC for Atomic Transfer (Tipping/Transactions)
-- This ensures race conditions do not drop balances below zero using Row-Level Locking
CREATE OR REPLACE FUNCTION transfer_kori(
    sender_wallet_id UUID,
    receiver_wallet_id UUID,
    transfer_amount DECIMAL,
    trx_type VARCHAR,
    trx_reference_id VARCHAR,
    trx_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
    new_transaction_id UUID;
    sender_balance DECIMAL;
BEGIN
    -- Input validation
    IF transfer_amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be greater than zero';
    END IF;

    -- Lock both rows to prevent concurrent updates (deadlock avoidance by sorting IDs if necessary, though simpler here)
    -- Ensure sender has enough funds (only lock sender initially to check)
    SELECT balance INTO sender_balance 
    FROM public.wallets 
    WHERE id = sender_wallet_id 
    FOR UPDATE;

    IF sender_balance < transfer_amount THEN
        RAISE EXCEPTION 'Insufficient funds in wallet %', sender_wallet_id;
    END IF;

    -- Deduct from sender
    UPDATE public.wallets
    SET balance = balance - transfer_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = sender_wallet_id;

    -- Add to receiver (Lock receiver)
    UPDATE public.wallets
    SET balance = balance + transfer_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = receiver_wallet_id;

    -- Insert double-entry ledger record
    INSERT INTO public.kori_transactions (
        from_wallet_id, to_wallet_id, amount, transaction_type, status, reference_id, metadata, completed_at
    ) VALUES (
        sender_wallet_id, receiver_wallet_id, transfer_amount, trx_type, 'completed', trx_reference_id, trx_metadata, CURRENT_TIMESTAMP
    ) RETURNING id INTO new_transaction_id;

    RETURN new_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 5. RPC for Wallet TopUp (Purchasing Kori)
CREATE OR REPLACE FUNCTION top_up_kori(
    target_wallet_id UUID,
    topup_amount DECIMAL,
    trx_type VARCHAR,
    trx_reference_id VARCHAR
) RETURNS DECIMAL AS $$
DECLARE
    new_balance DECIMAL;
BEGIN
    IF topup_amount <= 0 THEN
        RAISE EXCEPTION 'Topup amount must be greater than zero';
    END IF;

    -- Update wallet safely
    UPDATE public.wallets
    SET balance = balance + topup_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = target_wallet_id
    RETURNING balance INTO new_balance;

    -- Log transaction
    INSERT INTO public.kori_transactions (
        from_wallet_id, to_wallet_id, amount, transaction_type, status, reference_id, completed_at
    ) VALUES (
        NULL, target_wallet_id, topup_amount, trx_type, 'completed', trx_reference_id, CURRENT_TIMESTAMP
    );

    RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to auto-create wallet on New User registration
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_wallet
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();
