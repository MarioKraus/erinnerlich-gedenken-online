-- Drop existing overly permissive policies on search_agents
DROP POLICY IF EXISTS "Search agents are viewable by email" ON public.search_agents;
DROP POLICY IF EXISTS "Search agents can be updated by email match" ON public.search_agents;
DROP POLICY IF EXISTS "Search agents can be deleted" ON public.search_agents;
DROP POLICY IF EXISTS "Anyone can create search agents" ON public.search_agents;

-- Create secure RLS policies for search_agents
-- Users can only view their own search agents (by email match)
CREATE POLICY "Users can view their own search agents"
ON public.search_agents
FOR SELECT
USING (email = auth.jwt()->>'email');

-- Users can only create search agents with their own email
CREATE POLICY "Users can create their own search agents"
ON public.search_agents
FOR INSERT
WITH CHECK (email = auth.jwt()->>'email');

-- Users can only update their own search agents
CREATE POLICY "Users can update their own search agents"
ON public.search_agents
FOR UPDATE
USING (email = auth.jwt()->>'email')
WITH CHECK (email = auth.jwt()->>'email');

-- Users can only delete their own search agents
CREATE POLICY "Users can delete their own search agents"
ON public.search_agents
FOR DELETE
USING (email = auth.jwt()->>'email');

-- Service role has full access (for backend notifications)
CREATE POLICY "Service role has full access to search agents"
ON public.search_agents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also secure the related filter tables
DROP POLICY IF EXISTS "Filters follow parent agent" ON public.search_agent_filters;
DROP POLICY IF EXISTS "Filter groups follow parent agent" ON public.search_agent_filter_groups;

-- Filters: users can only access filters for their own agents
CREATE POLICY "Users can manage their own agent filters"
ON public.search_agent_filters
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.search_agents sa
    WHERE sa.id = agent_id AND sa.email = auth.jwt()->>'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.search_agents sa
    WHERE sa.id = agent_id AND sa.email = auth.jwt()->>'email'
  )
);

-- Filter groups: users can only access filter groups for their own agents
CREATE POLICY "Users can manage their own agent filter groups"
ON public.search_agent_filter_groups
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.search_agents sa
    WHERE sa.id = agent_id AND sa.email = auth.jwt()->>'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.search_agents sa
    WHERE sa.id = agent_id AND sa.email = auth.jwt()->>'email'
  )
);

-- Service role access for backend operations
CREATE POLICY "Service role has full access to filters"
ON public.search_agent_filters
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access to filter groups"
ON public.search_agent_filter_groups
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);