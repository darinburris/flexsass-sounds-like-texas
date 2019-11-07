$(document).ready(function() {
  var timeLeft = moment.tz("2019-11-07 18:00", "US/Central");

  $("#clock").countdown(timeLeft.toDate(), function(event) {
    $(this).html(event.strftime('<span>%H</span><span>%M</span><span>%S</span>'));
  });
});
