function filterSchedule() {
  const searchInput = document.getElementById('searchInput').value.toUpperCase();
  const fromFilter = document.getElementById('fromFilter').value.toUpperCase();
  const toFilter = document.getElementById('toFilter').value.toUpperCase();

  const table = document.getElementById('scheduleTable');
  const tr = table.getElementsByTagName('tr');

  for (let i = 1; i < tr.length; i++) {
    const tdTrainNo = tr[i].getElementsByTagName('td')[0];
    const tdTrainName = tr[i].getElementsByTagName('td')[1];
    const tdFrom = tr[i].getElementsByTagName('td')[2];
    const tdTo = tr[i].getElementsByTagName('td')[3];

    if (tdTrainNo && tdTrainName && tdFrom && tdTo) {
      const txtTrainNo = tdTrainNo.textContent || tdTrainNo.innerText;
      const txtTrainName = tdTrainName.textContent || tdTrainName.innerText;
      const txtFrom = tdFrom.textContent || tdFrom.innerText;
      const txtTo = tdTo.textContent || tdTo.innerText;

      let matchSearch = txtTrainNo.toUpperCase().includes(searchInput) || txtTrainName.toUpperCase().includes(searchInput);
      let matchFrom = fromFilter === "" || txtFrom.toUpperCase() === fromFilter;
      let matchTo = toFilter === "" || txtTo.toUpperCase() === toFilter;

      if (matchSearch && matchFrom && matchTo) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}
