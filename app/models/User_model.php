<?php

class User_model extends Model
{
    protected $table = 'users';
    protected $fillable = ['username', 'email', 'password', 'role', 'is_active'];
}