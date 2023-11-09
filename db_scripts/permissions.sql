-- ##### On master #####

-- Create SQL Server authentication users
CREATE LOGIN dev_user WITH PASSWORD = '';

CREATE LOGIN web_user WITH PASSWORD = '';

-- ##### On the database #####

CREATE USER dev_user FOR LOGIN dev_user;
CREATE USER web_user FOR LOGIN web_user;

-- Create the role
CREATE ROLE dev_role;

-- Grant permissions
GRANT CREATE TABLE TO dev_role;
GRANT CREATE PROCEDURE TO dev_role;
GRANT CREATE VIEW TO dev_role;
GRANT CREATE FUNCTION TO dev_role;
GRANT ALTER TO dev_role;
GRANT DELETE TO dev_role;
GRANT INSERT TO dev_role;
GRANT SELECT TO dev_role;
GRANT UPDATE TO dev_role;
GRANT EXECUTE TO dev_role;
GRANT REFERENCES TO dev_role;

-- Create the role
CREATE ROLE web_user_role;

-- Grant permissions
GRANT SELECT TO web_user_role;
GRANT INSERT TO web_user_role;
GRANT UPDATE TO web_user_role;
GRANT DELETE TO web_user_role;

-- Add users to roles
EXEC sp_addrolemember 'dev_role', 'dev_user';
EXEC sp_addrolemember 'web_user_role', 'web_user';
