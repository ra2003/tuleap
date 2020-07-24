<?php
/**
 * Copyright (c) Enalean, 2012-Present. All Rights Reserved.
 *
 * Tuleap is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Tuleap is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Tuleap; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */

use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Tuleap\SOAP\SOAPRequestValidator;

//phpcs:ignore PSR1.Classes.ClassDeclaration.MissingNamespace, Squiz.Classes.ValidClassName.NotCamelCaps
class SVN_SOAPServerTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    protected function setUp(): void
    {
        parent::setUp();
        $this->session_key = 'whatever';
        $this->group_id    = 123;
        $this->svn_path    = '/tags';

        $this->project = \Mockery::spy(\Project::class);
        $this->user    = \Mockery::spy(\PFUser::class);

        $this->soap_request_valid = Mockery::mock(SOAPRequestValidator::class);
        $this->soap_request_valid->shouldReceive('getProjectById')->with($this->group_id, \Mockery::any())->andReturns($this->project);
        $this->soap_request_valid->shouldReceive('continueSession')->with($this->session_key)->andReturns($this->user);

        $this->svn_repository_listing = \Mockery::spy(\SVN_RepositoryListing::class);
        $this->svn_repository_listing->shouldReceive('getSvnPathsWithLogDetails')->andReturns([]);
        $this->order = 'ASC';
    }

    public function testItCheckUserSessionAndGroupValidity(): void
    {
        $svn_repository_listing = \Mockery::spy(\SVN_RepositoryListing::class);
        $svn_repository_listing->shouldReceive('getSvnPaths')->with($this->user, $this->project, $this->svn_path)->once();

        $this->soap_request_valid->shouldReceive('assertUserCanAccessProject')->once();
        $svn_soap = new SVN_SOAPServer($this->soap_request_valid, $svn_repository_listing);
        $svn_soap->getSvnPath($this->session_key, $this->group_id, $this->svn_path);
    }

    public function testItCheckUserSessionAndGroupValidityWithLogDetails(): void
    {
        $svn_soap = new SVN_SOAPServer($this->soap_request_valid, $this->svn_repository_listing);
        $svn_soap->getSvnPathsWithLogDetails($this->session_key, $this->group_id, $this->svn_path, $this->order);
    }

    public function testItThrowsSoapFaultIfUserHasWrongPermissions(): void
    {
        $soap_request_valid     = Mockery::mock(SOAPRequestValidator::class);
        $soap_request_valid->shouldReceive('getProjectById')->with($this->group_id, \Mockery::any())->andReturns($this->project);
        $soap_request_valid->shouldReceive('continueSession')->with($this->session_key)->andReturns($this->user);
        $soap_request_valid->shouldReceive('assertUserCanAccessProject')->with($this->user, $this->project)->andReturns(new Exception());

        $svn_soap = new SVN_SOAPServer($soap_request_valid, $this->svn_repository_listing);
        $svn_soap->getSvnPathsWithLogDetails($this->session_key, $this->group_id, $this->svn_path, $this->order);
    }

    public function testItDoesNotThrowSoapFaultIfRepositoryIsEmpty(): void
    {
        $svn_soap = new SVN_SOAPServer($this->soap_request_valid, $this->svn_repository_listing);
        $svn_soap->getSvnPathsWithLogDetails($this->session_key, $this->group_id, $this->svn_path, $this->order);
    }
}
