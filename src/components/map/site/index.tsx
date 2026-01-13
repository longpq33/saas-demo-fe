'use client';

import { useState } from 'react';
import {  useSitesData } from '../hooks';
import { MetersMarkerGroup } from '../components';
import VietnamProvincesMap from '../VietnamProvincesMap';

export default function SitesMap() {
  const [isMounted] = useState(() => typeof window !== 'undefined');
  
  const { sites, loading: sitesLoading } = useSitesData(isMounted);
  
  return (
      <VietnamProvincesMap>
        {!sitesLoading && sites.length > 0 && <MetersMarkerGroup sites={sites} />}
      </VietnamProvincesMap>
  );
}

