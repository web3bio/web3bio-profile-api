DROP TRIGGER ignore_repeat_order;

CREATE TRIGGER validate_topup BEFORE INSERT ON topups BEGIN
  SELECT RAISE(ABORT, 'Expected a lowercase SHA-256 key hash')
  WHERE length(NEW.key_hash) IS NOT 64 OR length(CAST(NEW.key_hash AS BLOB)) IS NOT 64
    OR NEW.key_hash GLOB '*[^0-9a-f]*';

  SELECT RAISE(ABORT, 'Order already recorded with a different key or credit amount')
  WHERE EXISTS (SELECT 1 FROM topups WHERE order_id = NEW.order_id
    AND (key_hash IS NOT NEW.key_hash OR credits IS NOT NEW.credits));

  SELECT RAISE(IGNORE) WHERE EXISTS (SELECT 1 FROM topups WHERE order_id = NEW.order_id);
END;
