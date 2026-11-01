begin;
create table if not exists public.estera_synchronicities (
 id uuid primary key, owner uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 100), event_date date not null,
 story text not null check(length(story) between 1 and 1000),
 feeling text not null default '' check(length(feeling)<=500),
 interpretation text not null default '' check(length(interpretation)<=20000),
 created_at timestamptz not null default now()
);
create index if not exists estera_sync_owner_date on public.estera_synchronicities(owner,event_date desc);
alter table public.estera_synchronicities enable row level security;
revoke all on public.estera_synchronicities from anon,authenticated;
grant all on public.estera_synchronicities to service_role;
commit;
