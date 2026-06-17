create policy "users can delete their own aura reports"
  on public.aura_reports for delete to authenticated
  using (auth.uid() = user_id);

grant delete on public.aura_reports to authenticated;

notify pgrst, 'reload schema';
