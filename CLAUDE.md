# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository currently contains no application code — it is a placeholder for a personal collection of video games, special editions, steelbooks, artbooks, figures, and other gaming collectibles (see README.md). There is no build, lint, or test tooling yet since no source code exists.

## Planning notes: Recipes Website

`recepies-details/Recipes-Website-Context.txt` contains technical notes for a separate, not-yet-built "Recipes" website that may eventually live in this repo or its own repo. Key decisions recorded there:

- **Stack**: Supabase (Postgres + Storage) for data/photos, Vercel for hosting, GitHub → Vercel CI/CD on push.
- **Why Supabase over static JSON**: avoids a git commit + redeploy per recipe, supports adding recipes from a phone, and enables DB-backed search/filtering instead of filtering one large JSON file in the frontend.
- **Data model**: `recipes` (name, category, prep time, cook time, servings, weight, rating), `ingredients` (recipe_id, name, quantity, unit), `steps` (recipe_id, order, text), `categories`, and `favorites` (table or column, TBD).
- **Auth model**: effectively single-user for admin writes. Public read access is fine; writes (add/edit/delete) must go through an authenticated/password-protected admin route, enforced via Supabase Row Level Security (RLS). Never expose privileged/service-role Supabase credentials in frontend code.
- **Supabase project isolation**: use a dedicated Supabase project for the Recipes site (not shared with other projects) to keep RLS rules, schema, and resets clean.

When implementation begins, follow this architecture unless the user directs otherwise.
