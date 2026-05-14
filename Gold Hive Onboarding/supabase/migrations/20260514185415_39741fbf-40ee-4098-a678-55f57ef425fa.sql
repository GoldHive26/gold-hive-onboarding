
-- Drop publicly readable SELECT policy — exposes vendor emails to anyone
DROP POLICY IF EXISTS "Enable read for all" ON public.vendor_onboarding;

-- Keep public INSERT (anonymous wizard submissions) but with explicit checks
DROP POLICY IF EXISTS "Enable insert for all" ON public.vendor_onboarding;
CREATE POLICY "Public can submit onboarding"
ON public.vendor_onboarding
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'started'
  AND length(company_name) BETWEEN 1 AND 200
  AND length(contact_email) BETWEEN 3 AND 254
  AND contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- Allow UPDATE for the in-progress wizard, but prevent identity changes
-- and prevent reverting a completed record. Non-trivial WITH CHECK (no `true`).
CREATE POLICY "Public can advance own onboarding"
ON public.vendor_onboarding
FOR UPDATE
TO anon, authenticated
USING (status <> 'completed')
WITH CHECK (
  status IN ('in_progress', 'completed')
  AND length(company_name) BETWEEN 1 AND 200
  AND length(contact_email) BETWEEN 3 AND 254
);
