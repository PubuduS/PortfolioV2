$(document).ready(function() {
  var entries = [{
      label: 'HTML'
    },
    {
      label: 'CSS'
    },
    {
      label: 'C++'
    },
    {
      label: 'C'
    },
    {
      label: 'JAVA'
    },
    {
      label: 'PYTHON'
    },
    {
      label: 'JAVASCRIPT'
    },
    {
      label: 'NETBEANS'
    },
    {
      label: 'MYSQL'
    },
    {
      label: 'VSCODE'
    },
    {
      label: 'LINUX'
    },
    {
      label: 'AGILE DEVELOPMENT'
    },
    {
      label: 'OOP'
    },
    {
      label: 'DOXYGEN'
    },
    {
      label: 'BASH'
    },
    {
      label: 'UNITY'
    }
  ];

  var settings = {
    entries: entries,
    width: 640,
    height: 480,
    radius: '65%',
    radiusMin: 75,
    bgDraw: true,
    bgColor: '#41b3a3',
    opacityOver: 1.00,
    opacityOut: 0.05,
    opacitySpeed: 6,
    fov: 800,
    speed: 0.5,
    fontFamily: 'Courier, Arial, sans-serif',
    fontSize: '30',
    fontColor: '#0a192f',
    fontWeight: 'bold',
    fontStyle: 'normal',
    fontSretch: 'normal',
    fontToUpperCase: true
  };
  $('#tag').svg3DTagCloud(settings);
});
