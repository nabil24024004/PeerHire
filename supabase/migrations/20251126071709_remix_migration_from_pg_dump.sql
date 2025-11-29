CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'hirer',
    'freelancer'
);


--
-- Name: freelancer_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.freelancer_status AS ENUM (
    'available',
    'busy',
    'offline'
);


--
-- Name: job_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.job_status AS ENUM (
    'open',
    'assigned',
    'in_progress',
    'submitted',
    'completed',
    'cancelled'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Unknown')
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;


--
-- Name: update_conversation_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversation_timestamp() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid,
    hirer_id uuid NOT NULL,
    freelancer_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: freelancer_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.freelancer_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status public.freelancer_status DEFAULT 'offline'::public.freelancer_status,
    hourly_rate numeric(10,2),
    skills text[],
    handwriting_style text,
    handwriting_samples text[],
    total_jobs_completed integer DEFAULT 0,
    total_earnings numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: job_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    freelancer_id uuid NOT NULL,
    cover_letter text,
    proposed_price numeric(10,2),
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hirer_id uuid NOT NULL,
    freelancer_id uuid,
    title text NOT NULL,
    description text NOT NULL,
    work_type text NOT NULL,
    subject text,
    page_count integer NOT NULL,
    deadline timestamp with time zone NOT NULL,
    budget numeric(10,2) NOT NULL,
    quality_level text NOT NULL,
    status public.job_status DEFAULT 'open'::public.job_status,
    attachment_urls text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    job_id uuid,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    conversation_id uuid,
    attachment_url text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    department text NOT NULL,
    year_of_study integer,
    bio text,
    avatar_url text,
    rating numeric(3,2) DEFAULT 0,
    total_reviews integer DEFAULT 0,
    response_time text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewee_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: conversations conversations_hirer_id_freelancer_id_job_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_hirer_id_freelancer_id_job_id_key UNIQUE (hirer_id, freelancer_id, job_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: freelancer_profiles freelancer_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.freelancer_profiles
    ADD CONSTRAINT freelancer_profiles_pkey PRIMARY KEY (id);


--
-- Name: freelancer_profiles freelancer_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.freelancer_profiles
    ADD CONSTRAINT freelancer_profiles_user_id_key UNIQUE (user_id);


--
-- Name: job_applications job_applications_job_id_freelancer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_job_id_freelancer_id_key UNIQUE (job_id, freelancer_id);


--
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: messages update_conversation_on_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversation_on_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();


--
-- Name: freelancer_profiles update_freelancer_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_freelancer_profiles_updated_at BEFORE UPDATE ON public.freelancer_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: jobs update_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations conversations_freelancer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_hirer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_hirer_id_fkey FOREIGN KEY (hirer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: freelancer_profiles freelancer_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.freelancer_profiles
    ADD CONSTRAINT freelancer_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: job_applications job_applications_freelancer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: job_applications job_applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_freelancer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_hirer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_hirer_id_fkey FOREIGN KEY (hirer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: job_applications Applications are viewable by job owner and applicant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Applications are viewable by job owner and applicant" ON public.job_applications FOR SELECT USING (((auth.uid() = freelancer_id) OR (auth.uid() IN ( SELECT jobs.hirer_id
   FROM public.jobs
  WHERE (jobs.id = job_applications.job_id)))));


--
-- Name: freelancer_profiles Freelancer profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Freelancer profiles are viewable by everyone" ON public.freelancer_profiles FOR SELECT USING (true);


--
-- Name: job_applications Freelancers can create applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Freelancers can create applications" ON public.job_applications FOR INSERT WITH CHECK ((auth.uid() = freelancer_id));


--
-- Name: freelancer_profiles Freelancers can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Freelancers can insert their own profile" ON public.freelancer_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: freelancer_profiles Freelancers can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Freelancers can update their own profile" ON public.freelancer_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: jobs Hirers can create jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Hirers can create jobs" ON public.jobs FOR INSERT WITH CHECK ((auth.uid() = hirer_id));


--
-- Name: jobs Hirers can delete their own jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Hirers can delete their own jobs" ON public.jobs FOR DELETE USING ((auth.uid() = hirer_id));


--
-- Name: jobs Hirers can update their own jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Hirers can update their own jobs" ON public.jobs FOR UPDATE USING ((auth.uid() = hirer_id));


--
-- Name: jobs Jobs are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Jobs are viewable by everyone" ON public.jobs FOR SELECT USING (true);


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: reviews Reviews are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);


--
-- Name: user_roles User roles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User roles are viewable by everyone" ON public.user_roles FOR SELECT USING (true);


--
-- Name: conversations Users can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (((auth.uid() = hirer_id) OR (auth.uid() = freelancer_id)));


--
-- Name: reviews Users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK ((auth.uid() = reviewer_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_roles Users can insert their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own roles" ON public.user_roles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: messages Users can send messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT TO authenticated WITH CHECK (((auth.uid() = sender_id) AND (conversation_id IN ( SELECT conversations.id
   FROM public.conversations
  WHERE ((conversations.hirer_id = auth.uid()) OR (conversations.freelancer_id = auth.uid()))))));


--
-- Name: messages Users can update message read status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update message read status" ON public.messages FOR UPDATE TO authenticated USING ((auth.uid() = receiver_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: messages Users can view conversation messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view conversation messages" ON public.messages FOR SELECT TO authenticated USING ((conversation_id IN ( SELECT conversations.id
   FROM public.conversations
  WHERE ((conversations.hirer_id = auth.uid()) OR (conversations.freelancer_id = auth.uid())))));


--
-- Name: conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT TO authenticated USING (((auth.uid() = hirer_id) OR (auth.uid() = freelancer_id)));


--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: freelancer_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.freelancer_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: job_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


