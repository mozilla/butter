%define node_version 0.8.12
%define node_prefix /opt/node/%{node_version}


Name:		butter
Version:	0.9
Release:	1
Summary:	Buttered Popcorn
Packager:   Mozilla
License:	MPL
URL:		http://nodejs.org/
Source0:	https://github.com/downloads/mozilla/%{name}/%{name}-v%{version}.tar
ExclusiveArch:  %{ix86} x86_64

BuildRequires:	nodejs = %{node_version}

%description

%prep
%setup -q  -n dist


%build
export PATH=%{node_prefix}/bin:$PATH
npm install

%install
mkdir -p $RPM_BUILD_ROOT/opt/butter/%{version}
rsync -av ./ $RPM_BUILD_ROOT/opt/butter/%{version}
ln -s %{version} $RPM_BUILD_ROOT/opt/butter/current
mkdir -p /etc/init.d
cp butter.init /etc/init.d/butter.conf

%files
%defattr(-,root,root,-)
/opt/butter/%{version}
/opt/butter/current
/etc/init.d/butter.conf
%doc README.md


%changelog
