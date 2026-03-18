begin;

create policy "conversation members can update their membership"
on public.conversation_members
for update
to authenticated
using (
  profile_id = auth.uid()
  and public.is_conversation_member(conversation_id, auth.uid())
)
with check (
  profile_id = auth.uid()
  and public.is_conversation_member(conversation_id, auth.uid())
);

commit;
