$(function() {
    var messages = $('.message');
    messages.on('click', '.remove', function() {
        var msgId = $(this).parents('.message').attr('id');
        $.post('/remove', {id: msgId}, function() {
            window.location.pathname = '/';
        });
    });
});