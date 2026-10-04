<?php

class Auth_api extends Controller
{
    public function before_action()
    {
        $this->call->database();
        $this->call->library('api');
        $this->call->model('User_model');
    }

    public function register()
    {
        $this->api->require_method('POST');
        $body = $this->api->body();

        if (empty($body['username']) || empty($body['email']) || empty($body['password'])) {
            $this->api->respond_error('Username, email, and password are required.', 422);
        }
        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL) || strlen($body['password']) < 6) {
            $this->api->respond_error('Use a valid email and a password with at least 6 characters.', 422);
        }
        if ($this->User_model->find_by('email', $body['email'])) {
            $this->api->respond_error('Email is already registered.', 409);
        }

        $id = $this->User_model->insert([
            'username' => $body['username'],
            'email' => $body['email'],
            'password' => password_hash($body['password'], PASSWORD_DEFAULT),
            'role' => 'user',
            'is_active' => 1,
        ]);

        $this->api->respond(['message' => 'Registration successful.', 'user_id' => (int) $id], 201);
    }

    public function login()
    {
        $this->api->require_method('POST');
        $body = $this->api->body();
        $username = trim((string) ($body['username'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if (($username === '' && $email === '') || $password === '') {
            $this->api->respond_error('Username or email and password are required.', 422);
        }

        $user = null;

        if ($username !== '') {
            $user = $this->User_model->find_by('username', $username);
        }

        if (!$user && $email !== '') {
            $user = $this->User_model->find_by('email', $email);
        }

        if (!$user || !(int) $user['is_active'] || !password_verify($password, $user['password'])) {
            $this->api->respond_error('Invalid username/email or password.', 401);
        }

        $this->api->respond([
            'user' => [
                'id' => (int) $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'],
            ],
            'tokens' => $this->api->issue_tokens([
                'id' => (int) $user['id'],
                'role' => $user['role'],
                'scopes' => ['products:read', 'products:write'],
            ]),
        ]);
    }

    public function refresh()
    {
        $this->api->require_method('POST');
        $body = $this->api->body();
        $this->api->refresh_access_token($body['refresh_token'] ?? '');
    }
}