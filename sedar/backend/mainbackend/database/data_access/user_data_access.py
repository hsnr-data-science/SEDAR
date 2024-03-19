from commons.models.dataset.models import User
from werkzeug.exceptions import Conflict, NotFound, Unauthorized

#------------------------------------------------------------------------------------#
#CRUD
#------------------------------------------------------------------------------------#

def get(email:str) -> User:
    """
    Helper function to return a user via its associated email.

    :param email: of user.
    :returns: the user with the given email.
    """
    user: User = User.nodes.get_or_none(email__exact=email)

    if not user:
        raise NotFound(f"User with email {email} not found")

    return user

def check(email:str) -> User:
    """
    Helper function to return a user via its associated email.

    :param email: of user.
    :returns: the user with the given email.
    """
    user: User = User.nodes.get_or_none(email__exact=email)

    if not user:
        return False

    return True

def get_all(email_of_current_user:str) -> [User]:
    """
    Helper function to return all users. 

    :email_of_current_user: email of current user to exclude him from result.
    :returns: all users.
    """
    return User.nodes.filter(email__ne=email_of_current_user)

def update(email:str, new_email:str, firstname:str, lastname:str, old_password:str = '', new_password:str = '', username:str = '', is_admin:bool = None) -> User:
    """
    Updates a given user. 

    :param email: old email of user.
    :param new_email: new email of user.
    :param firstname: firstname of user.
    :param lastname: lastname of user.
    :param username: username of user
    :param old_password: the current password. 
    :param new_password: the new password.
    :returns: updated user.
    """
    user = get(email)
    if email != new_email:
        user.email = new_email
    user.firstname = firstname
    user.lastname = lastname
    user.username = username
    if is_admin != None:
        user.is_admin = is_admin
    if old_password != "" and new_password != "":
        if not user.verify_hash(old_password):
            raise Unauthorized(f"Wrong password")
        user.password_hash=User.generate_hash(new_password)
    user.save()
    return user

def add(email:str, firstname:str, lastname:str, password:str, is_admin:bool, username:str) -> User:
    """
    Adds a new user to the database. 

    :param email: email of user.
    :param password: password for user.
    :param firstname: firstname of user.
    :param lastname: lastname of user.
    :param is_admin: defines if the user is admin or not.
    :returns: newly created user.
    """
    try:
        get(email)
        raise Conflict(f"User with email {email} already exists")
    except NotFound:
        user = User(
            email=email,
            password_hash=User.generate_hash(password),
            firstname=firstname,
            lastname=lastname,
            is_admin=is_admin, 
            username=username
        )
        user.save()
        return user

def delete(email:str)->None:
    """
    Deletes a user from the database. 

    :param email: email of user.
    :returns: None
    """
    user = get(email)
    user.delete()
    return
        
