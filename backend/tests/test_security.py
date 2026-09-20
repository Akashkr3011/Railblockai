"""
RAILBLOCK AI — Security and Auth Tests

Tests JWT creation/verification and password hashing.
Does NOT require PostgreSQL.
"""
from __future__ import annotations

import pytest
from jose import JWTError
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    create_refresh_token,
)


# -------------------------------------------------------------------------
# Password hashing
# -------------------------------------------------------------------------

def test_hash_password_is_not_plaintext():
    hashed = hash_password("TestPassword123!")
    assert hashed != "TestPassword123!"
    assert len(hashed) > 20


def test_verify_password_correct():
    plain = "RailBlock@2026"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("CorrectPassword")
    assert verify_password("WrongPassword", hashed) is False


def test_different_hashes_for_same_password():
    """bcrypt must produce different hashes each time (salt)."""
    plain = "SamePassword123"
    hash1 = hash_password(plain)
    hash2 = hash_password(plain)
    assert hash1 != hash2
    # Both should verify correctly
    assert verify_password(plain, hash1) is True
    assert verify_password(plain, hash2) is True


# -------------------------------------------------------------------------
# JWT access token
# -------------------------------------------------------------------------

def test_create_access_token():
    token = create_access_token("user-uuid-123")
    assert isinstance(token, str)
    assert len(token) > 50


def test_decode_access_token():
    subject = "user-uuid-abc"
    token = create_access_token(subject)
    payload = decode_access_token(token)
    assert payload["sub"] == subject
    assert payload["type"] == "access"


def test_access_token_has_extra_claims():
    token = create_access_token("user-uuid-123", extra_claims={"role": "ADMIN"})
    payload = decode_access_token(token)
    assert payload["role"] == "ADMIN"


def test_decode_invalid_token_raises():
    with pytest.raises(JWTError):
        decode_access_token("this.is.not.a.real.token")


def test_decode_tampered_token_raises():
    token = create_access_token("user-uuid-123")
    tampered = token[:-5] + "XXXXX"
    with pytest.raises(JWTError):
        decode_access_token(tampered)


# -------------------------------------------------------------------------
# JWT refresh token
# -------------------------------------------------------------------------

def test_create_refresh_token():
    token = create_refresh_token("user-uuid-456")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-uuid-456"
    assert payload["type"] == "refresh"
