%define node_version 0.8.12
%define node_prefix /opt/node/%{node_version}


Name:		butter
Version:	@VERSION@
Release:	1
Summary:	An SDK for authoring Popcorn projects
Packager:   Mozilla
License:	MIT
URL:		https://github.com/mozilla/butter
Source0:	https://github.com/downloads/mozilla/%{name}/%{name}-%{version}.tar
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
mkdir -p $RPM_BUILD_ROOT/etc/init
cp butter.init $RPM_BUILD_ROOT/etc/init/butter.conf

%files
%defattr(-,root,root,-)
/opt/butter/%{version}
/opt/butter/current
/etc/init/butter.conf
%doc README.md


%changelog
