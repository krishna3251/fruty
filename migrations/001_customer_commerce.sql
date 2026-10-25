-- Additive migration. Does not alter the existing Blob catalogue or Clerk accounts.
CREATE TABLE IF NOT EXISTS tf_customers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), clerk_user_id text UNIQUE NOT NULL,
 name text NOT NULL DEFAULT '', verified_email text, phone text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tf_addresses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES tf_customers(id) ON DELETE CASCADE,
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tf_addresses_customer ON tf_addresses(customer_id);
CREATE TABLE IF NOT EXISTS tf_carts (
 customer_id uuid PRIMARY KEY REFERENCES tf_customers(id) ON DELETE CASCADE,
 items jsonb NOT NULL DEFAULT '{}', version integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tf_cart_merges (
 customer_id uuid NOT NULL REFERENCES tf_customers(id) ON DELETE CASCADE, merge_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(customer_id,merge_id)
);
CREATE TABLE IF NOT EXISTS tf_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference text UNIQUE NOT NULL,
 request_id uuid UNIQUE NOT NULL, customer_id uuid REFERENCES tf_customers(id) ON DELETE SET NULL,
 customer jsonb NOT NULL, items jsonb NOT NULL, subtotal numeric(12,2) NOT NULL CHECK(subtotal>=0),
 delivery numeric(12,2) CHECK(delivery>=0), total numeric(12,2) CHECK(total>=0),
 status text NOT NULL DEFAULT 'enquiry_initiated' CHECK(status IN ('enquiry_initiated','awaiting_confirmation','confirmed','preparing','dispatched','delivered','cancelled')),
 payment_method text NOT NULL DEFAULT 'unconfirmed', payment_status text NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid','refunded')),
 history jsonb NOT NULL DEFAULT '[]', version integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tf_orders_customer ON tf_orders(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS tf_orders_status ON tf_orders(status,created_at DESC);
CREATE TABLE IF NOT EXISTS tf_business (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), data jsonb NOT NULL, version integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tf_rate_limits (
 key text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL
);
-- A row lock makes merges atomic; merge IDs make a retried guest merge idempotent.
-- max(local,server) is deliberate: deterministic union without doubling quantities.
CREATE OR REPLACE FUNCTION tf_sync_cart(cid uuid, incoming jsonb, expected integer, merge_key uuid DEFAULT NULL)
RETURNS TABLE(items jsonb, version integer) LANGUAGE plpgsql AS $$
DECLARE current_cart tf_carts%ROWTYPE; merged jsonb;
BEGIN
 INSERT INTO tf_carts(customer_id) VALUES(cid) ON CONFLICT DO NOTHING;
 SELECT * INTO current_cart FROM tf_carts WHERE customer_id=cid FOR UPDATE;
 IF merge_key IS NOT NULL THEN
  IF EXISTS(SELECT 1 FROM tf_cart_merges WHERE customer_id=cid AND merge_id=merge_key) THEN
   RETURN QUERY SELECT current_cart.items,current_cart.version; RETURN;
  END IF;
  SELECT coalesce(jsonb_object_agg(k,to_jsonb(q)),'{}') INTO merged FROM (
    SELECT k,max(v::integer) q FROM (
      SELECT key k,value v FROM jsonb_each_text(current_cart.items)
      UNION ALL SELECT key,value FROM jsonb_each_text(incoming)
    ) a GROUP BY k
  ) b;
  INSERT INTO tf_cart_merges(customer_id,merge_id) VALUES(cid,merge_key);
 ELSE
  IF current_cart.version<>expected THEN RAISE EXCEPTION 'cart_conflict' USING ERRCODE='40001'; END IF;
  merged:=incoming;
 END IF;
 UPDATE tf_carts c SET items=merged,version=c.version+1,updated_at=now() WHERE c.customer_id=cid;
 RETURN QUERY SELECT c.items,c.version FROM tf_carts c WHERE c.customer_id=cid;
END $$;
CREATE OR REPLACE FUNCTION tf_save_address(cid uuid, aid uuid, payload jsonb)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE saved uuid;
BEGIN
 PERFORM 1 FROM tf_customers WHERE id=cid FOR UPDATE;
 IF aid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM tf_addresses WHERE id=aid AND customer_id=cid) THEN RAISE EXCEPTION 'address_not_found'; END IF;
 IF aid IS NULL AND (SELECT count(*) FROM tf_addresses WHERE customer_id=cid)>=10 THEN RAISE EXCEPTION 'address_limit'; END IF;
 IF payload->>'isDefault'='true' THEN
  UPDATE tf_addresses SET data=jsonb_set(data,'{isDefault}','false'),updated_at=now() WHERE customer_id=cid;
 END IF;
 IF aid IS NULL THEN INSERT INTO tf_addresses(customer_id,data) VALUES(cid,payload) RETURNING id INTO saved;
 ELSE UPDATE tf_addresses SET data=payload,updated_at=now() WHERE id=aid AND customer_id=cid RETURNING id INTO saved;
 END IF;
 RETURN saved;
END $$;
