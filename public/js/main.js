$(document).ready(function () {
	$('.delete-customer').on('click', function () {
		//make request to delete
		var id = $(this).data('id');
		var url = '/users/sales2/delete/' + id;
		if (confirm('Delete Customer?')) {
			$.ajax({
				url: url,
				type: 'DELETE',
				success: function (result) {
					console.log('Deleting Customer...');
					window.location.href = '/users/sales2';
				},
				error: function (err) {
					console.log(err);
				},
			});
		}
	});
	// Create event for edit
	$('.edit-customer').on('click', function () {
		$('#edit-form-firstname').val($(this).data('firstname'));
		$('#edit-form-lastname').val($(this).data('lastname'));
		$('#edit-form-country').val($(this).data('country'));
		$('#edit-form-city').val($(this).data('city'));
		$('#edit-form-province').val($(this).data('province'));
		$('#edit-form-postalcode').val($(this).data('postalcode'));
		$('#edit-form-email').val($(this).data('email'));
		$('#edit-form-age').val($(this).data('age'));
		$('#edit-form-date').val($(this).data('date'));
		$('#edit-form-gender').val($(this).data('gender'));
		$('#edit-form-request').val($(this).data('request'));
		$('#edit-form-file').val($(this).data('file'));
		$('#edit-form-phone').val($(this).data('phone'));
		$('#edit-form-url').val($(this).data('url'));
		$('#edit-form-requeststatus').val($(this).data('requeststatus'));
		$('#edit-form-id').val($(this).data('id'));
	});
});
