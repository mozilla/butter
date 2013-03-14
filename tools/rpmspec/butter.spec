%define node_version 0.8.22
%define node_prefix /opt/node/%{node_version}

Name:		butter
Version:	@VERSION@
Release:	1
Summary:	An SDK for authoring Popcorn projects
Packager:   Mozilla
License:	MIT
URL:		https://github.com/mozilla/butter
Source0:	https://github.com/downloads/mozilla/%{name}/%{name}-%{version}.tar.bz2
ExclusiveArch:  %{ix86} x86_64

BuildRequires:	nodejs = %{node_version}
Requires: upstart

%description

%prep
%setup -q  -n dist

%build
export PATH=%{node_prefix}/bin:$PATH
npm install

%install
mkdir -p $RPM_BUILD_ROOT/opt/butter/%{version}
rsync -av --exclude 'sax/examples/' ./ $RPM_BUILD_ROOT/opt/butter/%{version}
ln -s %{version} $RPM_BUILD_ROOT/opt/butter/current
mkdir -p $RPM_BUILD_ROOT%{_sysconfdir}/init
cp butter.init $RPM_BUILD_ROOT%{_sysconfdir}/init/butter.conf

%postun
if [ $1 -ge 1 ] ; then
  /sbin/restart %{name}
fi

%files
%defattr(-,root,root,-)
/opt/butter/%{version}
/opt/butter/current
%{_sysconfdir}/init/butter.conf
%doc README.md


%changelog
