from selenium import selenium
import unittest, time, re, sys

sys.path.append( "../../../../content/" );
import testvars

global btv
btv = testvars.ButterTestVariables

class testcase_TrackDrop(unittest.TestCase):

    def setUp( self ):
      self.verificationErrors = []
      self.selenium = selenium( btv["Host"],
                                btv["Port"],
                                btv["Browser"],
                                btv["Grid"]
                                )
      self.selenium.start()

    def test_case(self):
        sel = self.selenium
        sel.open(btv["ButterTestPage"])
        sel.set_speed( 500 )
        sel.wait_for_page_to_load("7500")
        for i in range(60):
            try:
                if sel.is_element_present("id=TrackEventView1"): break
            except: pass
            time.sleep(1)
        else: self.fail("time out")
        sel.mouse_move_at("id=TrackEventView1", "5,0")
        sel.mouse_down_at("id=TrackEventView1", "5,0")
        self.failUnless(sel.is_element_present("id=TrackView2"))
        sel.mouse_move_at("id=TrackView2", "300,5")
        sel.mouse_up_at("id=TrackView2", "300,5")
        self.failUnless(sel.is_element_present("id=TrackEventView1"))

    def tearDown(self):
        self.selenium.stop()
        self.assertEqual([], self.verificationErrors)

class testcase_DeleteTrack(unittest.TestCase):
    def setUp(self):
      self.verificationErrors = []
      self.selenium = selenium( btv["Host"],
                                btv["Port"],
                                btv["Browser"],
                                btv["Grid"]
                                )
      self.selenium.start()

    def test_delete_track(self):
        sel = self.selenium
        sel.open(btv["ButterTestPage"])
        sel.wait_for_page_to_load("7500")
        for i in range(60):
            try:
                if sel.is_element_present("id=TrackView2"): break
            except: pass
            time.sleep(1)
        else: self.fail("time out")
        self.failUnless(sel.is_element_present("id=TrackView2"))
        self.failUnless(sel.is_element_present("id=TrackView1"))
        self.failUnless(sel.is_element_present("id=track-handle-Track0"))
        self.failUnless(sel.is_element_present("id=TrackEventView1"))
        # sel.asser("id=track-handle-Track2", "0,5")
        sel.mouse_down_at("id=track-handle-Track2", "0,5")
        sel.mouse_move_at("id=track-handle-Track1", "5,15")
        sel.mouse_up_at("id=track-handle-Track1", "5,15")
        self.failUnless(sel.is_element_present("id=TrackView2"))
        self.failUnless(sel.is_element_present("id=TrackView1"))
        self.failUnless(sel.is_element_present("id=track-handle-Track0"))
        self.failUnless(sel.is_element_present("id=TrackEventView1"))

    def tearDown(self):
        self.selenium.stop()
        self.assertEqual([], self.verificationErrors)
