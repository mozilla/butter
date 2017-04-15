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
mkdir -p $RPM_BUILD_ROOT%{_sysconfdir}/init
cp butter.init $RPM_BUILD_ROOT%{_sysconfdir}/init/butter.conf

# restart the job after upgrade or migrate to init script on removal
# cannot be stopped with 'service' as /etc/init/$name.conf may be missing
# at this point
%define        upstart_postun() \
       if [ -x /sbin/initctl ] && /sbin/initctl status "%1" 2>/dev/null | grep -q 'running' ; then \
               /sbin/initctl stop "%1" >/dev/null 2>&1 \
               [ -f "/etc/rc.d/init.d/%1" -o -f "/etc/init/%1.conf" ] && { echo -n "Re-" ; /sbin/service "%1" start ; } ; \+       fi

%postun
%upstart_postun butter

%files
%defattr(-,root,root,-)
/opt/butter/%{version}
/opt/butter/current
%{_sysconfdir}/init/butter.conf
%doc README.md


%changelog
